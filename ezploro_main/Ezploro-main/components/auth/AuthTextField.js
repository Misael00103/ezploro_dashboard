import { TextInput } from "react-native-paper"
import { scaleDimension, scaleFont } from "../../utils/responsive"

const defaultOutlineStyle = { borderRadius: scaleDimension(12) }
const defaultContentStyle = { paddingHorizontal: scaleDimension(16) }

export default function AuthTextField({
  style,
  outlineStyle,
  contentStyle,
  mode = "outlined",
  outlineColor = "#E5E7EB",
  activeOutlineColor = "#8B5CF6",
  backgroundColor = "#F9FAFB",
  fontSize = scaleFont(16),
  ...props
}) {
  const resolvedOutlineStyle = outlineStyle
    ? { ...defaultOutlineStyle, ...outlineStyle }
    : defaultOutlineStyle
  const resolvedContentStyle = contentStyle
    ? { ...defaultContentStyle, ...contentStyle }
    : defaultContentStyle

  return (
    <TextInput
      mode={mode}
      outlineColor={outlineColor}
      activeOutlineColor={activeOutlineColor}
      outlineStyle={resolvedOutlineStyle}
      style={[
        {
          marginBottom: scaleDimension(16),
          backgroundColor,
          fontSize,
          width: "100%",
        },
        style,
      ]}
      contentStyle={resolvedContentStyle}
      {...props}
    />
  )
}

