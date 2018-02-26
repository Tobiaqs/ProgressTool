module.exports = {
    getTimestamp () {
        return Math.floor(Date.now() / 1000);
    },
    
    getNewExpiryTimestamp () {
        return this.getTimestamp() + 3600 * 24 * 60;
    }
};
