export const sanitizeUser = (userDocument) => {
  if (!userDocument) return null;
  const user = userDocument.toObject ? userDocument.toObject() : userDocument;

  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    organization: user.organization,
    address: user.address,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};
