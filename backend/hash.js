const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = '654321'; // Пароль учителя
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
}

hashPassword();