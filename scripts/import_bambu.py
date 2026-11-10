"""Read Bambu 3MF metadata into local, immutable project snapshots. No printer writes."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone

MAX_METADATA = 4 * 1024 * 1024
SETTING_KEYS = frozenset({
    'printer_model', 'printer_settings_id', 'print_settings_id', 'nozzle_diameter',
    'layer_height', 'initial_layer_print_height', 'sparse_infill_density',
    'sparse_infill_pattern', 'wall_loops', 'top_shell_layers', 'bottom_shell_layers',
    'top_shell_thickness', 'bottom_shell_thickness', 'enable_support',
    'filament_type', 'filament_settings_id', 'filament_colour', 'extruder',
    'nozzle_temperature', 'nozzle_temperature_initial_layer', 'curr_bed_type',
    'textured_plate_temp', 'textured_plate_temp_initial_layer', 'hot_plate_temp',
    'hot_plate_temp_initial_layer', 'cool_plate_temp', 'cool_plate_temp_initial_layer',
})


def settings(values):
    return {key: value for key, value in values.items() if key in SETTING_KEYS}


def metadata(element):
    return {item.get('key'): item.get('value', '') for item in element.findall('metadata') if item.get('key')}


def xml(data):
    # Reject UTF-16/32 and entity declarations before parsing untrusted archives.
    text = data.decode('utf-8-sig')
    if '\x00' in text or re.search(r'<!\s*(DOCTYPE|ENTITY)', text, re.I):
        raise ValueError('XML entity declarations are unsupported.')
    return ET.fromstring(text)


def number(value):
    try:
        result = float(value)
        return result if 0 <= result < 1e12 else None
    except (ValueError, TypeError):
        return None


def plate_number(value):
    if not isinstance(value, str) or not re.fullmatch(r'[1-9][0-9]{0,3}', value):
        raise ValueError('Missing or unsupported plate number; refusing to guess plate identity.')
    return int(value)


def inspect_project(path):
    path = Path(path)
    if path.suffix.lower() != '.3mf':
        raise ValueError('Select a Bambu .3mf or .gcode.3mf project.')
    with path.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
        source.seek(0)
        with zipfile.ZipFile(source) as archive:
            entries = archive.infolist()
            names = [entry.filename for entry in entries]
            if len(entries) > 10000 or len(names) != len(set(names)):
                raise ValueError('Archive has too many or duplicate entries.')

            def read(name):
                if name not in names:
                    return None
                entry = archive.getinfo(name)
                if entry.file_size > MAX_METADATA:
                    raise ValueError('Project metadata exceeds the size limit.')
                with archive.open(entry) as stream:
                    data = stream.read(MAX_METADATA + 1)
                if len(data) > MAX_METADATA:
                    raise ValueError('Project metadata exceeds the size limit.')
                return data

            model_data = read('Metadata/model_settings.config')
            slice_data = read('Metadata/slice_info.config')
            project_data = read('Metadata/project_settings.config')
            model = xml(model_data) if model_data else ET.Element('config')
            sliced = xml(slice_data) if slice_data else ET.Element('config')
            config = json.loads(project_data) if project_data else {}
            if not isinstance(config, dict):
                raise ValueError('Project settings must be a JSON object.')
            objects = {}
            for obj in model.findall('object'):
                values = metadata(obj)
                objects[obj.get('id')] = {
                    'objectId': obj.get('id'), 'name': values.get('name'),
                    'settings': settings(values),
                    'parts': [{'partId': part.get('id'), 'name': metadata(part).get('name'),
                               'settings': settings(metadata(part))} for part in obj.findall('part')],
                }
            plates = {}
            for plate in model.findall('plate'):
                values = metadata(plate)
                index = plate_number(values.get('plater_id'))
                if index in plates:
                    raise ValueError('Duplicate plate identity.')
                instances = [metadata(instance) for instance in plate.findall('model_instance')]
                plates[index] = {
                    'plateNumber': index, 'name': values.get('plater_name') or f'Plate {index}',
                    'settings': settings(values),
                    'objects': [{'objectId': item.get('object_id'), 'instanceId': item.get('instance_id'),
                                 'definition': objects.get(item.get('object_id'))} for item in instances],
                    'sliceEstimate': None,
                }
            seen = set()
            for plate in sliced.findall('plate'):
                values = metadata(plate)
                index = plate_number(values.get('index'))
                if index in seen:
                    raise ValueError('Duplicate sliced plate identity.')
                seen.add(index)
                record = plates.setdefault(index, {'plateNumber': index, 'name': f'Plate {index}',
                                                   'settings': {}, 'objects': [], 'sliceEstimate': None})
                record['sliceEstimate'] = {
                    'durationSeconds': number(values.get('prediction')),
                    'filamentGrams': number(values.get('weight')),
                    'nozzleDiametersMm': values.get('nozzle_diameters'),
                    'filaments': [{key: item.get(key) for key in ('id', 'type', 'color', 'used_g', 'used_m')}
                                  for item in plate.findall('filament')],
                }
            if not plates:
                raise ValueError('No explicit Bambu plate metadata found. A mesh alone is not a print project.')
            return {
                'schemaVersion': 1, 'revisionId': digest, 'name': path.name.removesuffix('.3mf'),
                'source': {'kind': 'bambu-3mf', 'filename': path.name, 'sha256': digest,
                           'importedAt': datetime.now(timezone.utc).isoformat()},
                'settings': settings(config),
                'plates': [{'plateId': f'{digest}:{index}', **plates[index]} for index in sorted(plates)],
                'attempts': [],
                'warnings': ['Imported settings describe this saved file, not necessarily the job sent to the printer.',
                             'Object and part overrides are preserved separately; global settings are not universal.',
                             'Plate files and slice estimates do not prove a print ran or succeeded.'],
            }


def save_snapshot(project, directory):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    target = directory / (project['revisionId'] + '.json')
    # Stage a complete file, then link atomically without overwriting an existing import.
    fd, temporary = tempfile.mkstemp(prefix='.import-', dir=directory)
    try:
        with os.fdopen(fd, 'w') as output:
            json.dump(project, output, indent=2, ensure_ascii=False, allow_nan=False)
            output.write('\n')
        try:
            os.link(temporary, target)
            created = True
        except FileExistsError:
            created = False
    finally:
        os.unlink(temporary)
    return target, created


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('projects', nargs='+', type=Path)
    args = parser.parse_args()
    destination = Path(__file__).resolve().parents[1] / '.tmp' / 'bambu-imports'
    failed = False
    for path in args.projects:
        try:
            project = inspect_project(path)
            target, created = save_snapshot(project, destination)
            print(f'{"Imported" if created else "Already imported"}: {path.name} — {len(project["plates"])} plates')
            for plate in project['plates']:
                print(f'  Plate {plate["plateNumber"]}: {plate["name"]} — print status unknown')
            print(f'  Saved locally: {target}')
        except (OSError, ValueError, ET.ParseError, zipfile.BadZipFile, RuntimeError):
            print(f'Could not import {path.name}: unreadable or unsupported Bambu metadata.', file=sys.stderr)
            failed = True
    return int(failed)


if __name__ == '__main__':
    sys.exit(main())
