import * as React from "react";
import { cn } from "@/lib/utils";

// Defining props for the Input component, extending standard HTML input attributes
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isRequired?: boolean; // Example custom property
}

// Using React.forwardRef to pass refs to the input element
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', isRequired, ...props }, ref) => { // Default type to 'text'
    return (
      <input
        type={type}
        required={isRequired} // Use the custom property
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props} // Spread the rest of the props
      />
    );
  }
);

// Set a display name for easier debugging in React DevTools
Input.displayName = "Input";

export { Input };
