"use client"

import * as React from "react"
import { DayFlag, DayPicker, SelectionState, UI } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(className)}
      classNames={{
        [UI.Root]: cn("p-3", classNames?.[UI.Root]),
        [UI.Months]: cn(
          "flex flex-col gap-4 sm:flex-row sm:gap-4",
          classNames?.[UI.Months]
        ),
        [UI.Month]: cn("space-y-3", classNames?.[UI.Month]),
        [UI.MonthCaption]: cn(
          "relative flex items-center justify-center pt-1",
          classNames?.[UI.MonthCaption]
        ),
        [UI.CaptionLabel]: cn(
          "text-sm font-semibold tracking-tight",
          classNames?.[UI.CaptionLabel]
        ),
        [UI.Nav]: cn("flex items-center gap-1", classNames?.[UI.Nav]),
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute left-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-xl bg-transparent p-0 opacity-90 shadow-sm hover:opacity-100",
          classNames?.[UI.PreviousMonthButton]
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-xl bg-transparent p-0 opacity-90 shadow-sm hover:opacity-100",
          classNames?.[UI.NextMonthButton]
        ),
        [UI.MonthGrid]: cn("w-full border-collapse", classNames?.[UI.MonthGrid]),
        [UI.Weekdays]: cn("flex w-full", classNames?.[UI.Weekdays]),
        [UI.Weekday]: cn(
          "w-9 text-center text-[0.75rem] font-medium text-muted-foreground",
          classNames?.[UI.Weekday]
        ),
        [UI.Weeks]: cn("mt-2 flex flex-col gap-1", classNames?.[UI.Weeks]),
        [UI.Week]: cn("flex w-full", classNames?.[UI.Week]),
        [UI.Day]: cn(
          "relative flex h-9 w-9 items-center justify-center p-0 text-center text-sm",
          classNames?.[UI.Day]
        ),
        [UI.DayButton]: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-9 w-9 rounded-xl p-0 font-normal text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-primary/20",
          classNames?.[UI.DayButton]
        ),
        [DayFlag.outside]: cn(
          "text-muted-foreground/60 opacity-60",
          classNames?.[DayFlag.outside]
        ),
        [DayFlag.disabled]: cn(
          "text-muted-foreground/50 opacity-50",
          classNames?.[DayFlag.disabled]
        ),
        [DayFlag.today]: cn(
          "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary/70",
          classNames?.[DayFlag.today]
        ),
        [SelectionState.selected]: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          classNames?.[SelectionState.selected]
        ),
        [SelectionState.range_middle]: cn(
          "bg-primary/10 text-foreground",
          classNames?.[SelectionState.range_middle]
        ),
        [SelectionState.range_start]: cn(
          "bg-primary text-primary-foreground",
          classNames?.[SelectionState.range_start]
        ),
        [SelectionState.range_end]: cn(
          "bg-primary text-primary-foreground",
          classNames?.[SelectionState.range_end]
        ),
      }}
      components={{
        Chevron: ({ orientation, ...p }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" {...p} />
          ) : (
            <ChevronRight className="h-4 w-4" {...p} />
          ),
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }

