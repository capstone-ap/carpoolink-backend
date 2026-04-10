// JSON 직렬화 함수
export function serialize(value) {
    return JSON.parse(
        JSON.stringify(value, (_, currentValue) => (typeof currentValue === 'bigint' ? currentValue.toString() : currentValue))
    );
}