import Foundation
import Security

// Called only by the local Node helper. Secrets travel over pipes, never argv or logs.
let args = CommandLine.arguments
func fail(_ code: Int32) -> Never { exit(code) }
guard args.count == 3, ["get", "set", "delete"].contains(args[1]), args[2].count < 100 else { fail(2) }
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrService as String: "com.layerlog.printer",
    kSecAttrAccount as String: args[2]
]
switch args[1] {
case "get":
    var request = query
    request[kSecReturnData as String] = true
    request[kSecMatchLimit as String] = kSecMatchLimitOne
    var result: CFTypeRef?
    let status = SecItemCopyMatching(request as CFDictionary, &result)
    if status == errSecItemNotFound { fail(3) }
    guard status == errSecSuccess, let data = result as? Data else { fail(4) }
    FileHandle.standardOutput.write(data)
case "set":
    let data = FileHandle.standardInput.readData(ofLength: 4097)
    guard !data.isEmpty, data.count <= 4096 else { fail(2) }
    let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
    if status == errSecItemNotFound {
        var item = query
        item[kSecValueData as String] = data
        item[kSecAttrLabel as String] = "LayerLog printer access"
        guard SecItemAdd(item as CFDictionary, nil) == errSecSuccess else { fail(4) }
    } else if status != errSecSuccess { fail(4) }
case "delete":
    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else { fail(4) }
default: fail(2)
}
