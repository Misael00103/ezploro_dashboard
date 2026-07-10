// Configuración específica para Google Sheets
export const GOOGLE_SHEETS_CONFIG = {
  // Credenciales del proyecto
  project_id: "scape-462817",
  private_key_id: "2f557cc377652249a61b872271bcbd8f193c6854",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCpRVXttfERxLA3\n2CbmjxZKU5jzB+PTOOtZq9UZ97S2C7jHNeQ16YHaY2jw14qkXlwtHxxQ8EDie/if\n/iK8TWjgGgqT53Xi/QeESDsWd+5U/zvh9aZZ7W3agL7w/C958LBkFdFyWFkLoMjv\n1BubdbxEuyNYKTwr9hqWJvkpcsKLZBktcaGrle/riCebu0EqydnA4uvOiujg5o3t\n8WcN4kq/YNueNsEd2k3OBSgyPoIaNgdGYcF6EhqvyLNtGeVCACMgkcPXI0DnUSWO\nXdC4qf2qvyVXh9rikNxyRiUqX1Iy2QniCikcUT8989NhoEU+Pb9CAbZNgNBIBQ56\nO1r+6EKrAgMBAAECggEARNe8MOeUWeOiv7Obbp23NRd21zDYSamWnmuySdNinb96\nsRqL7BlCBK31mi4vZtYxqvBCNfDgkrxUy80yF19sTeiJcMnsOhsqmXQ/A85XEh6U\nHjwoId7clMdT4PLP5EotkycEffrMjFwiHNgpOjrSDSoHH+31WPPIsFS9dUwFL2cl\nvQ4PRegsjvChHRsWXpw/9sbAmH9DOe/N8bY/X3sxoOSmHqVIghFHzVtTq+nam+6X\n/+7J4EO9keDzzGC+a3tZpUnKaiLMJk3s0JhdJe+C6cD13eYbNmcJJmpnv1lgQF2Z\nRP5yiSH5CgTpiv2ifTRDz2kRVFcKijxwOC2QolJEIQKBgQDtsDaK5JHP6V7Bu/yQ\netHXs9k5DybA3t5u/K4AYFa3QWPY3EX55koheFfy1tQvhxnRVshPpBO9/6rJ6QWH\nohq0pxUfCbzwCFyrS9pK+X7MBfeT+au6GXkOgIWpMHMgKxkl0EGHVbZJx7GMr5hi\nnCHuZ/wd/5fvDOGGUoLHG8xfeQKBgQC2T8PHJ+mI/qxnViD4FzFSkNMmfWPaAeMp\n5XKlJgnieq6DNzy4USbZzmA6Q0E6rjjQUIpPSay0pnMblNMfth+WADS1XH76SOlr\n7MC+kIDgryxEBb91FughuHl8XOCT5zrfB+6h0XkIq9B8SjG1Yz/I5vXbBffL/h8I\nVOwRzdX2QwKBgQDBsvi/98VcSjKOb0RD+dNIlahQd6h9RSLAD+s9I0WH0iIseFYO\ncT24SPpjS+9fTBoeHzrerDfqfpAQO3XmMpTQ49iykp0Gf8oFTqt2rhxG6BX64Vyx\nLFEbIGHMn08yx+yWhEDiqVcEiViH7hGhStvcDaHIUKLgjP69GEC7QkwrAQKBgQCT\nIUhkv4cvMii8tLuivETn100wsN0WoZNMyol9UneDuXKBHuD39zYdbPonywMnclcT\ndwxH9LNWj0YyKidAXmCbU8s12lH3d0Q5/zWGFWSM75IPy3u56SSpohEZFnN/qYrP\nV710BnNhVhfJVq9LLa/aWNptSiGzFYDB3pctvyo/tQKBgQCCgq6ecC0nYVBh1cfy\nb78Y+sbb2f31nzOIDMfjdEcx2JGLO425BG55C3cATs4XU+gPUFZnmYm2H5SPXzPP\nWHcbgwx/tWMVtPRjYAji2l53pfaCa+bkV0QgIid3kI+G0IVwbe66GwMUFHfT9PVh\n2RdEd8ywsKKxB07DWc2V/SHe2Q==\n-----END PRIVATE KEY-----\n",
  client_email: "ezploro-703@scape-462817.iam.gserviceaccount.com",
  client_id: "107414187633995360734",
  
  // URLs de autenticación
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/ezploro-703%40scape-462817.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
  
  // Configuración de la hoja
  spreadsheet_id: "2f557cc377652249a61b872271bcbd8f193c6854", // ID real del usuario
  range: "Eventos!A:D",
  
  // Scopes necesarios
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ]
}

// Función para obtener token de acceso
export const getGoogleAccessToken = async () => {
  try {
    // Por ahora usamos la API key simple
    // En el futuro se puede implementar OAuth2 completo
    return null
  } catch (error) {
    console.error("Error obteniendo token de Google:", error)
    return null
  }
} 