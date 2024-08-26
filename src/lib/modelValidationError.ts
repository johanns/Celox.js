type Errors = {
    [key: string]: string[];
};

class ModelValidationError extends Error {
    errors: Errors;

    constructor(errors: Errors, name: string) {
        super(`ModelValidationError: ${name}`);

        this.errors = errors;
        this.name = name;
    }
}

export default ModelValidationError;
