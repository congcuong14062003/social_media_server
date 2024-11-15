// Hàm chuyển đổi giá trị falsy
function convertFalsyValues(obj) {
  for (let key in obj) {
    if (typeof obj[key] === "string") {
      if (obj[key].toLowerCase() === "null") obj[key] = null;
      else if (obj[key].toLowerCase() === "undefined") obj[key] = undefined;
      else if (obj[key] === "0") obj[key] = 0;
      else if (obj[key].toLowerCase() === "false") obj[key] = false;
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      convertFalsyValues(obj[key]); // Đệ quy với các object lồng nhau
    }
  }
  return obj;
}


export default convertFalsyValues; // convert
