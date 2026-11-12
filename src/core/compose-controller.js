/**
 * Композиция методов без глобальных переменных и циклического импорта контроллера.
 */
export function composeController(Controller, capabilities) {
    for (const capability of capabilities) {
        for (const name of Object.getOwnPropertyNames(capability.prototype)) {
            if (name === 'constructor') continue;
            if (name in Controller.prototype) {
                throw new Error(`Повторный метод контроллера: ${name} (${capability.name})`);
            }
            Object.defineProperty(
                Controller.prototype,
                name,
                Object.getOwnPropertyDescriptor(capability.prototype, name)
            );
        }
    }
}
