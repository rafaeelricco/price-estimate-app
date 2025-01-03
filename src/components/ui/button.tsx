import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
   'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300',
   {
      variants: {
         variant: {
            default:
               'bg-neutral-900 text-neutral-50 hover:bg-neutral-900/90 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90',
            destructive:
               'bg-red-500 text-neutral-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/90',
            outline:
               'border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-50',
            secondary:
               'bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80',
            ghost: 'hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50',
            link: 'text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50'
         },
         size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-11 rounded-md px-8',
            icon: 'h-10 w-10'
         }
      },
      defaultVariants: {
         variant: 'default',
         size: 'default'
      }
   }
)

export interface ButtonProps
   extends React.ButtonHTMLAttributes<HTMLButtonElement>,
      VariantProps<typeof buttonVariants> {
   asChild?: boolean
   loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
   (
      {
         className,
         variant,
         size,
         asChild = false,
         loading = false,
         onClick,
         ...props
      },
      ref
   ) => {
      const Comp = asChild ? Slot : 'button'
      return (
         <Comp
            className={cn(
               buttonVariants({ variant, size, className }),
               loading && 'cursor-wait'
            )}
            onClick={(e) => {
               if (loading) return
               onClick?.(e)
            }}
            disabled={loading || props.disabled}
            ref={ref}
            {...props}
         >
            <div className="relative flex items-center justify-center">
               <span
                  className={cn(loading && 'invisible', 'flex items-center')}
               >
                  {props.children}
               </span>
               {loading && (
                  <span className="loader animation-spin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
               )}
            </div>
         </Comp>
      )
   }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
