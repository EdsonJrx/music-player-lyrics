export const toAppProtocolPath = (filePath?: string) => {
  if (!filePath) return ''
  return filePath.replace('file://', 'app://')
}
