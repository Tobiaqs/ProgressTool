module.exports = {
    getTimestamp () {
        return Math.floor(Date.now() / 1000);
    },
    
    getNewExpiryTimestamp () {
        return this.getTimestamp() + 3600 * 24 * 60;
    },

    testUUID (input) {
        return /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(input);
    }
};
