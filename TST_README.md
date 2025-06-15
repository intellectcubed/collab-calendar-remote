## Testing README
To test methods on index.js, run the below command: 

```
node js/testMatrix.js
```

---
## Adding new tests
- Export the method from index.js (add the method name to the export at the bottom)
- Operations that check for the final matrix can invoke ```invokeTest(testName)```
- Add a placeholder to ```expectedResults.json``` by copying the ```dummy``` element and replace it with the name of the test
- Run the unit tests - the new test should fail and output the actual results (verify that it did what you wanted by looking at the output)
- Copy and paste the results to the ```expectedResults.json```

## Zipping:
(From directory: /Users/gnowakow/Projects/website/collab-calendar-remote)
```
zip -r ../collab-calendar-remote.zip ../collab-calendar-remote
```

---
## Testing the html locally:
Run a web server that is pointing to your project root: 
```

python3 -m http.server 8000 --directory /Users/gman/Projects/Websites/collab-calendar-remote

python3 -m http.server 8000 --directory /Users/gnowakow/Projects/website/collab-calendar-remote
```

## Important Note:
If you are using the local http server, and you make changes to the javascript files, you will need to clear your browser cache to see the changes.  Try a hard refresh (cmd+shift+r on Mac) or clear the cache from the browser settings.

Then navigate to: ```http://localhost:8000```