module.exports = {
	port: process.env.NODEJS_APP_PORT || 2000,
	ip: process.env.NODEJS_APP_IP || '0.0.0.0',
	env: process.env.NODEJS_APP_ENV || 'development'
};

console.log("Environment: " + module.exports.env);