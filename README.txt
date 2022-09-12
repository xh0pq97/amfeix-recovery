Recovery attempt for AMFEIX investor funds

This code was written for AMFEIX Investor 'J'.

Originally intended as a tool to help AMFEIX refund investors, it gradually evolved in the direction of a more complete website that was targeted to be a successor of the AMFEIX website.

Development on the project ceased around the time when I was informed that I had failed and a software development company was hired to build a new project instead.

The github actions for this project show how it can be built.  The action builds the code and commits the compiled code to a different github repository.  Using github pages, this github repository was published directly on the web using a custom domain name.  This approach was used to improve the security against malicious changes in the frontend -- something that was claimed to be the reason for the original 'hack'.

The system may require a backend (source code included in bitcoin-rpc-wrapper) that mostly acts as simple caches for relevant blockchain data, but may also apply some transformations.  To run the project, the backend must be set up and the frontend code must be adjusted to point at it.

Sven
