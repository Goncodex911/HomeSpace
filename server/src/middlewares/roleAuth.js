export const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized, user details missing' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied, role required: ${roles.join(' or ')}` });
    }

    next();
  };
};
