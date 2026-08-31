export function isLayerVisible(project: any, layerId: string): boolean {
  if (!project) return false
  const layer = project.layers.find((l: any) => l.id === layerId)
  return layer ? layer.visible : true
}
