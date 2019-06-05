import React from 'react';

const Button = React.forwardRef(({ children, ...rest }, ref) => <button {...rest} ref={ref}>{children}</button>);

export default Button;