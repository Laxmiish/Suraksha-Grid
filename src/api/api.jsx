export const generateEKYCKey = async (aadhaar) => {
  const response = await fetch("http://localhost:5000/api/generate-ekyc-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aadhaar }),
  });
  return response.json();
};

export const registerUser = async (data) => {
  const response = await fetch("http://localhost:5000/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const loginUser = async ({ mobile, password, role }) => {
  try {
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password, role }),
    });
    return response.json();
  } catch (err) {
    return { success: false, message: "Server se connect nahi ho paya" };
  }
};