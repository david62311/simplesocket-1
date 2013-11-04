build: components lib/index.js
	@component build --dev

components: component.json
	@component install --dev

uglify:
	@component build -s SimpleSocket
	@uglifyjs -nc --unsafe -mt -o simplesocket.min.js build/build.js
	@mv build/build.js simplesocket.js

clean:
	rm -rf build components

.PHONY: clean