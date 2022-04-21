class DebugViewer {
    constructor(list) {
        this.list = list;
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext("2d");
        window.addEventListener("resize", this.resize.bind(this));

        const loop = () => {
            this.render();
            requestAnimationFrame(loop);
        }

        this.resize();
        loop();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = "yellow";
        
        const outerRect = this.list.container.getBoundingClientRect();

        // draw outside elements
        this.ctx.beginPath();
        for (const item of this.list.buffer) {
            const rect = item.element.getBoundingClientRect();
            this.ctx.rect(rect.left, rect.top, rect.width, rect.height);
            this.ctx.stroke();
        }
        this.ctx.clearRect(outerRect.left, outerRect.top, outerRect.width, outerRect.height);
    
        // draw scroll y
        this.ctx.strokeStyle = "blue";
        this.ctx.beginPath();
        this.ctx.rect(outerRect.left, outerRect.top + this.list.lastY - this.list.container.scrollTop, outerRect.width, this.list.itemHeight);
        this.ctx.stroke();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}
