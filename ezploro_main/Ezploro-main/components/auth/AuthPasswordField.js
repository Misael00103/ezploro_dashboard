import { useState } from "react"
import { TextInput } from "react-native-paper"
import AuthTextField from "./AuthTextField"
import { scaleDimension } from "../../utils/responsive"

export default function AuthPasswordField({
  initiallyVisible = false,
  onVisibilityChange,
  iconColor = "#8B5CF6",
  iconSize = scaleDimension(24),
  ...props
}) {
  const [visible, setVisible] = useState(initiallyVisible)

  const handleToggle = () => {
    setVisible((current) => {
      const next = !current
      onVisibilityChange?.(next)
      return next
    })
  }

  return (
    <AuthTextField
      secureTextEntry={!visible}
      right={
        <TextInput.Icon
          icon={visible ? "eye-off" : "eye"}
          onPress={handleToggle}
          color={iconColor}
          size={iconSize}
        />
      }
      {...props}
    />
  )
}

