let maplibreglInstance: any = null

export function setMaplibregl(instance: any) {
  maplibreglInstance = instance
}

export function getMaplibregl() {
  return maplibreglInstance
}
