import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from import_bambu import inspect_project, save_snapshot, MAX_METADATA


class BambuImportTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)

    def archive(self, files):
        path = self.root / 'synthetic.3mf'
        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, content in files.items():
                archive.writestr(name, content)
        return path

    def test_multiple_plates_preserve_overrides_and_unknown_print_status(self):
        path = self.archive({
            'Metadata/project_settings.config': json.dumps({'layer_height': '0.2', 'sparse_infill_density': '15%', 'private_field': 'not imported'}),
            'Metadata/model_settings.config': '''<config>
              <object id="7"><metadata key="sparse_infill_density" value="8%"/>
                <part id="9"><metadata key="extruder" value="2"/></part></object>
              <plate><metadata key="plater_id" value="2"/><metadata key="plater_name" value="Base"/>
                <model_instance><metadata key="object_id" value="7"/><metadata key="instance_id" value="0"/></model_instance></plate>
              <plate><metadata key="plater_id" value="1"/><metadata key="plater_name" value="Basket"/></plate>
              </config>''',
        })
        project = inspect_project(path)
        self.assertEqual([p['name'] for p in project['plates']], ['Basket', 'Base'])
        self.assertEqual(project['attempts'], [])
        self.assertNotIn('private_field', project['settings'])
        self.assertEqual(project['settings']['sparse_infill_density'], '15%')
        definition = project['plates'][1]['objects'][0]['definition']
        self.assertEqual(definition['settings']['sparse_infill_density'], '8%')
        self.assertEqual(definition['parts'][0]['settings']['extruder'], '2')

    def test_sliced_project_estimates_are_not_print_results(self):
        project = inspect_project(self.archive({'Metadata/slice_info.config': '''<config><plate>
          <metadata key="index" value="3"/><metadata key="prediction" value="120"/>
          <metadata key="weight" value="NaN"/><filament id="1" type="PETG" used_g="4"/>
          </plate></config>'''}))
        self.assertEqual(project['plates'][0]['plateNumber'], 3)
        self.assertEqual(project['plates'][0]['sliceEstimate']['durationSeconds'], 120)
        self.assertIsNone(project['plates'][0]['sliceEstimate']['filamentGrams'])
        self.assertEqual(project['attempts'], [])

    def test_same_file_import_is_idempotent_and_changes_create_new_revision(self):
        data = '<config><plate><metadata key="plater_id" value="1"/></plate></config>'
        path = self.archive({'Metadata/model_settings.config': data})
        project = inspect_project(path)
        target, created = save_snapshot(project, self.root / 'out')
        original = target.read_bytes()
        self.assertTrue(created)
        project['source']['importedAt'] = 'different'
        self.assertFalse(save_snapshot(project, self.root / 'out')[1])
        self.assertEqual(target.read_bytes(), original)
        path = self.archive({'Metadata/model_settings.config': data.replace('value="1"', 'value="2"')})
        self.assertNotEqual(inspect_project(path)['revisionId'], project['revisionId'])
        self.assertEqual(target.stat().st_mode & 0o777, 0o600)

    def test_mesh_only_and_ambiguous_plate_identity_rejected(self):
        for data in ['<config/>', '<config><plate/></config>',
                     '<config><plate><metadata key="plater_id" value="1"/></plate><plate><metadata key="plater_id" value="1"/></plate></config>']:
            with self.assertRaises(ValueError):
                inspect_project(self.archive({'Metadata/model_settings.config': data}))

    def test_entities_and_oversized_metadata_rejected(self):
        for data in ['<!DOCTYPE config [<!ENTITY name "unsafe">]><config/>', 'x' * (MAX_METADATA + 1)]:
            with self.assertRaises(ValueError):
                inspect_project(self.archive({'Metadata/model_settings.config': data}))

    def test_no_archive_entries_are_extracted(self):
        path = self.archive({'../escape.txt': 'not extracted',
                             'Metadata/model_settings.config': '<config><plate><metadata key="plater_id" value="1"/></plate></config>'})
        inspect_project(path)
        self.assertFalse((self.root.parent / 'escape.txt').exists())


if __name__ == '__main__':
    unittest.main()
