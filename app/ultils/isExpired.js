function isExpired(expirationTime) {
    // Lấy thời gian hiện tại
    const now = new Date();
    
    // Chuyển đổi thời gian hết hạn sang đối tượng Date
    const expirationDate = new Date(expirationTime);
    
    // So sánh thời gian hiện tại với thời gian hết hạn
    return now > expirationDate;
}

export {
    isExpired
}