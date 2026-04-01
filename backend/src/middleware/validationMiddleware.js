function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export const validators = {
  requiredString(field, label = field) {
    return (input) => {
      if (!input?.[field] || !String(input[field]).trim()) {
        return `${label} is required.`;
      }
      return null;
    };
  },
  email(field = 'email') {
    return (input) => {
      if (!isEmail(input?.[field])) {
        return 'A valid email is required.';
      }
      return null;
    };
  },
  minLength(field, length, label = field) {
    return (input) => {
      if (String(input?.[field] || '').trim().length < length) {
        return `${label} must be at least ${length} characters.`;
      }
      return null;
    };
  },
  enum(field, values, label = field) {
    return (input) => (
      values.includes(input?.[field]) ? null : `${label} must be one of: ${values.join(', ')}.`
    );
  },
  optionalString(field, maxLength, label = field) {
    return (input) => {
      if (!input?.[field]) return null;
      return String(input[field]).length <= maxLength ? null : `${label} is too long.`;
    };
  },
};

export function validateRequest({ body = [], params = [], query = [] }) {
  return (req, _res, next) => {
    try {
      const errors = [
        ...body.map((rule) => rule(req.body)),
        ...params.map((rule) => rule(req.params)),
        ...query.map((rule) => rule(req.query)),
      ].filter(Boolean);

      if (errors.length) {
        throw validationError(errors[0]);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
