import { Dimensions } from "react-native"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

const BASE_WIDTH = 375
const MAX_SCALE_MULTIPLIER = 1.2

const getScaledValue = (size) => {
  const scaled = size * (SCREEN_WIDTH / BASE_WIDTH)
  return Math.min(scaled, size * MAX_SCALE_MULTIPLIER)
}

export const scaleFont = (size) => getScaledValue(size)

export const scaleDimension = (size) => getScaledValue(size)

export const responsive = {
  scaleFont,
  scaleDimension,
}

