module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const rules = req.body;
    if (rules) {
        context.bindings.outputFile = rules;
        context.res = {
            status: 200,
            body: "Rules saved successfully."
        };
    } else {
        context.res = {
            status: 400,
            body: "Please pass the rules in the request body."
        };
    }
};