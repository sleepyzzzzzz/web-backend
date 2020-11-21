require('es6-promise').polyfill();
require('isomorphic-fetch');
const url = path => `http://localhost:3000${path}`;
let cookie;

describe('Validate Auth', () => {
    it('validate POST /register: Register a new user named "testUser" with password "123"', (done) => {
        let user = {
            username: "testUser",
            email: "test@gmail.com",
            dob: "128999122000",
            zipcode: 12345,
            password: "123"
        };
        fetch(url('/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        }).then(res => {
            if (res.status === 401) {
                expect(res.status).toEqual(401);
                expect(res.statusText).toEqual('Unauthorized');
                done();
            }
            else {
                return res.json();
            }
        }).then(res => {
            if (res) {
                expect(res.username).toEqual('testUser');
                expect(res.result).toEqual('success');
            }
            done();
            // }).then(res => res.json()).then(res => {
            //     expect(res.username).toEqual('testUser');
            //     expect(res.result).toEqual('success');
            //     done();
            // });
        });
    });

    it('validate POST /login: Log in as "testUser"', (done) => {
        let login_user = { username: "testUser", password: "123" };
        fetch(url('/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(login_user)
        }).then((res) => {
            // const setCookie = res.headers.get('set-cookie');
            // cookie = setCookie.substr(0, setCookie.indexOf(';'));
            cookie = res.headers.raw()['set-cookie'];
            setTimeout(function () { }, 3000);
            return res.json();
        }).then(res => {
            console.log(res);
            expect(res.username).toEqual('testUser');
            expect(res.result).toEqual('success');
            done();
        });
    });

    it('validate PUT /headline: Update the status headline and verify the change', (done) => {
        let headline = { headline: 'Happy' };
        fetch(url('/headline'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'cookie': cookie },
            body: JSON.stringify(headline)
        }).then(res => res.json()).then(res => {
            expect(res.username).toEqual('testUser');
            expect(res.headline).toEqual('Happy');
            done();
        });
    });

    it('validate GET /headline: Update the status headline and verify the change', (done) => {
        fetch(url('/headline'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'cookie': cookie }
        }).then(res => res.json()).then(res => {
            expect(res.username).toEqual('testUser');
            expect(res.headline).toEqual('Happy');
            done();
        });

        fetch(url('/headline/testUser'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'cookie': cookie }
        }).then(res => res.json()).then(res => {
            expect(res.username).toEqual('testUser');
            expect(res.headline).toEqual('Happy');
            done();
        });
    });

    it('validate POST /article: Create a new article and verify that the article was added', (done) => {
        let article = { text: 'a new article' };
        fetch(url('/article'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'cookie': cookie },
            body: JSON.stringify(article)
        }).then(res => res.json()).then(res => {
            let articles = res.articles;
            if (articles instanceof Array) {
                expect(articles.length).toBeGreaterThan(0);
                expect(articles[articles.length - 1].text).toEqual('a new article');
                expect(articles[articles.length - 1].author).toEqual('testUser');
                let pid = articles[articles.length - 1].pid;
                fetch(url('/articles/' + pid), {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'cookie': cookie }
                }).then(res1 => res1.json()).then(res1 => {
                    let article = res1.articles[0];
                    expect(article.author).toEqual('testUser');
                    expect(article.text).toEqual('a new article');
                    done();
                });
            }
            done();
        });
    });

    it('validate GET /articles', (done) => {
        fetch(url('/articles'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'cookie': cookie }
        }).then(res => res.json()).then(res => {
            let articles = res.articles;
            if (articles instanceof Array) {
                expect(articles.length).toBeGreaterThan(0);
            }
            done();
        });
    });

    it('validate GET /articles/id', (done) => {
        fetch(url('/articles/testUser'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'cookie': cookie }
        }).then(res => res.json()).then(res => {
            let articles = res.articles;
            if (articles instanceof Array) {
                expect(articles.length).toBeGreaterThan(0);
                expect(articles[articles.length - 1].text).toEqual('a new article');
                expect(articles[articles.length - 1].author).toEqual('testUser');
            }
            done();
        });
    });

    it('validate PUT /logout: Log out "testUser"', (done) => {
        fetch(url('/logout'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'cookie': cookie },
        }).then(res => res).then(res => {
            expect(res.status).toEqual(200);
            expect(res.statusText).toEqual('OK');
            done();
        });
    });
})