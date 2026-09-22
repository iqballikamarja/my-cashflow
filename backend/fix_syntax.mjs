import fs from 'fs';
import path from 'path';

const txPath = path.resolve('../cashflow-web-dashboard/backend/routes/transactions.js');
let txContent = fs.readFileSync(txPath, 'utf8');

txContent = txContent.replace("res.status(500).json({ message: err.message });\n  }\n});\n  }\n});", "res.status(500).json({ message: err.message });\n  }\n});");

// In case CRLF:
txContent = txContent.replace("res.status(500).json({ message: err.message });\r\n  }\r\n});\r\n  }\r\n});", "res.status(500).json({ message: err.message });\r\n  }\r\n});");

fs.writeFileSync(txPath, txContent, 'utf8');
console.log('Fixed syntax error in transactions.js');
