export const placeAll = (instance: object, ...values: any[]) => {
  values.forEach((properties) => {
    if (Array.isArray(properties)) {
      properties.forEach((innerProperties) => {
        Object.keys(innerProperties).forEach((key) => {
          instance[key] = innerProperties[key]
        })
      })
    } else {
      Object.keys(properties).forEach((key) => {
        instance[key] = properties[key]
      })
    }
  })
}
