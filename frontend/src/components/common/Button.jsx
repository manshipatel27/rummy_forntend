import React from 'react'
import { Children } from 'react'

function Button({
    children,
    type = '',
    bgColor = '',
    textColor = '',
    className = " ",
    ...props
}) {
  return (
    <button className={`px-4 py-2 ${bgColor} ${textColor} ${className}`} {...props}>{children}</button>
  )
}

export default Button