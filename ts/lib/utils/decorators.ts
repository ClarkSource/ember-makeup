export const memoize: MethodDecorator = <T>(
  target: unknown,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>
) => {
  if (typeof descriptor.value !== 'function')
    throw new TypeError(
      `Cannot use '@memoize' on '${String(
        propertyKey
      )}' on '${target}', which is is not a method.`
    );

  const originalMethod = descriptor.value;
  const didRun = false;
  let memoized: unknown;

  // eslint-disable-next-line no-param-reassign
  descriptor.value = (function(this: InstanceType<any>, ...args: unknown[]) {
    if (didRun) return memoized;
    memoized = originalMethod.apply(this, args);
    return memoized;
  } as unknown) as T;
};
