interface Window {
  CSS?: {
    supports(propertyName: string, value: string): boolean;
    supports(supportCondition: string): boolean;
  };
}
