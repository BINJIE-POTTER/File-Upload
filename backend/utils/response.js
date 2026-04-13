export const success = (res, data, message = "ok") =>
  res.json({ code: 0, message, data });

export const fail = (res, status, message, code = status) =>
  res.status(status).json({ code, message, data: null });
