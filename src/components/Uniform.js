export function uniformGen(a,b,dim,num){
    let arr = []
    for (let i = 0; i < num; i++) {
        let v=[]
        for (let j = 0; j < dim; j++) {
            v.push(Math.random()*(b-a)+a);
        }
        arr.push(v);
    }
    return arr;
}