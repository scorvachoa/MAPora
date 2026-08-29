let instance: any = null

export const setMapInstance = (map: any) => {
  instance = map
}

export const getMapInstance = () => instance
