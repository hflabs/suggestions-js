export default (ms: number = 1000) =>
    new Promise((r) => {
        setTimeout(r, ms);
    });
