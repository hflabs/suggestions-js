/**
 * Возвращает вложенное значение по указанному пути в объекте
 * например, 'data.address.value'
 */
export const getDeepValue = <O extends object>(object: O, path: string) => {
    const keys = path.split(".");
    let result = object as unknown;

    while (keys.length && result) {
        const key = keys.shift();
        result =
            typeof result === "object" && key
                ? (result as Record<string, unknown>)[key]
                : undefined;
    }

    return result as string | undefined;
};

type KeyType = string | number | symbol;
/**
 * Проверяет наличие ключа в объекте
 */
export function isKeyOfObject<O extends object>(key: KeyType, obj: O): key is keyof O {
    return key in obj;
}

/**
 * Рекурсивно проверяет переданные объекты на совпадение по ключам из первого объекта
 */
export const areSame = (a: unknown, b: unknown) => {
    if (typeof a !== typeof b) return false;
    if (typeof a === "object" && a != null && b != null) {
        return Object.keys(a).every((k): boolean => {
            const key = k as keyof typeof a;
            return areSame(a[key], b[key]);
        });
    }
    return a === b;
};

/**
 * Условно глубокое клонирование - рекурсивно копирует данные для объекта и массива,
 * для остальных типов данных возвращает как есть
 */
export const clone = <T>(value: T): T => {
    if (Array.isArray(value)) return value.map(clone) as T;

    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)])) as T;
    }

    return value;
};
