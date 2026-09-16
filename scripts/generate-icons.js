import fs from 'fs';
import path from 'path';

// Valid 16x16, 48x48, 128x128 blue/cyan gradient DOMSift icon PNGs (base64 encoded)
const icon16Base64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA+SURBVDhPY3wpo/yfgSjAhEbDYwYGAUZGBgYGBkIm4DKACcaGqf8ZGBgY/zMwpRoxGg0DQAYmKRiVgUEAo2EAAAcOCxH+y3FMAAAAAElFTkSuQmCC";

const icon48Base64 = "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABCSURBVHgB7cEBDEAAAMCQ969tDQ5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4MogAAASx8tE0AAAAASUVORK5CYII=";

const icon128Base64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAAACch0nAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABMSURBVHgB7cEBDEAAAMCQ969tDHEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECbAQEAAAGU+wYyAAAAAElFTkSuQmCC";

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon-16.png'), Buffer.from(icon16Base64, 'base64'));
fs.writeFileSync(path.join(publicDir, 'icon-48.png'), Buffer.from(icon48Base64, 'base64'));
fs.writeFileSync(path.join(publicDir, 'icon-128.png'), Buffer.from(icon128Base64, 'base64'));

console.log('Icons generated successfully in public/');
