// Config for the shared date-picker sheet (app/date-picker.tsx). The picked
// value is returned via the callback (can't go through route params).
export interface DatePickerConfig {
  title: string;
  value: Date | null;
  maximumDate?: Date;
  minimumDate?: Date;
  onPick: (date: Date) => void;
}

let current: DatePickerConfig | null = null;

export function setDatePicker(config: DatePickerConfig): void {
  current = config;
}

export function getDatePicker(): DatePickerConfig | null {
  return current;
}
