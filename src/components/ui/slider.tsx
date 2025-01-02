import { cn } from '@/lib/utils'
import * as RadixSlider from '@radix-ui/react-slider'
import * as React from 'react'

interface SliderProps {
   min?: number
   max?: number
   step?: number
   name?: string
   value?: number
   defaultValue?: number
   onValueChange?: (value: number) => void
}

export const Slider: React.FC<SliderProps> = ({
   value,
   onValueChange = () => {},
   defaultValue = 50,
   min = 0,
   max = 100,
   step = 1,
   name
}: SliderProps) => {
   const [internalValue, setInternalValue] = React.useState(defaultValue)
   const [isUsingPointer, setIsUsingPointer] = React.useState(false)
   const [stash, setStash] = React.useState({ clientX: 0, value: defaultValue })

   function updateValue(newValue: number) {
      setInternalValue(newValue)
      onValueChange(newValue)
   }

   function clamp(number: number, min: number, max: number) {
      return Math.min(max, Math.max(number, min))
   }

   function roundToStep(num: number, step: number) {
      const inverseStep = 1 / step
      return Math.round(num * inverseStep) / inverseStep
   }

   return (
      <React.Fragment>
         <div className="flex w-full justify-start gap-3">
            <p className="text-base text-white">Volume</p>
            <p className="text-base text-white">{internalValue}</p>
         </div>
         <div className="duration-[350ms] *:duration-[350ms] group flex w-full touch-none select-none items-center gap-3 transition-[margin] hover:-mx-3 hover:cursor-grab active:cursor-grabbing">
            {/* <SpeakerXMarkIcon className="size-5 shrink-0 transition group-hover:scale-125 group-hover:text-white" /> */}
            <RadixSlider.Root
               name={name}
               min={min}
               max={max}
               step={step}
               value={[value ?? internalValue]}
               defaultValue={[defaultValue]}
               className="relative flex h-1.5 w-full grow items-center transition-[height] group-hover:h-4"
               onValueCommit={([v]) => updateValue(v)}
               onPointerDown={(e) => {
                  setStash({ clientX: e.clientX, value: internalValue })
                  setIsUsingPointer(true)
               }}
               onPointerMove={(e) => {
                  if (e.buttons > 0) {
                     let diffInPixels = e.clientX - stash.clientX
                     let sliderWidth = e.currentTarget.clientWidth
                     let pixelsPerUnit = (max - min) / sliderWidth
                     let diffInUnits = diffInPixels * pixelsPerUnit
                     let newValue = stash.value + diffInUnits
                     let clampedValue = clamp(newValue, min, max)
                     let steppedValue = roundToStep(clampedValue, step)

                     updateValue(steppedValue)
                  }
               }}
               onBlur={() => setIsUsingPointer(false)}
            >
               <RadixSlider.Track
                  className={cn(
                     'relative h-full grow overflow-hidden rounded-full bg-gray-700',
                     {
                        'group-has-[:focus-visible]:outline group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-sky-500':
                           isUsingPointer === false
                     }
                  )}
               >
                  <RadixSlider.Range className="absolute h-full bg-gray-300 transition group-hover:bg-white">
                     <div className="absolute inset-0 group-has-[:focus-visible]:bg-white" />
                  </RadixSlider.Range>
               </RadixSlider.Track>
               <RadixSlider.Thumb />
            </RadixSlider.Root>
            {/* <SpeakerWaveIcon className="size-5 shrink-0 transition group-hover:scale-125 group-hover:text-white" /> */}
         </div>
      </React.Fragment>
   )
}
