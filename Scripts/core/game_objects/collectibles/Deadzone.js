function Deadzone(game, args){
    //Basics
    Collectible.call(this, game, args);

    this.anchor.set(0,0);
    this.body.setSize(args.width, args.height);
    this.body.collideWorldBounds = false;
}

Deadzone.prototype = Object.create(Collectible.prototype);
Deadzone.prototype.constructor = Deadzone;

//Collectible overrides

Deadzone.prototype.onPickup = function(heroine){
    heroine.onDeath.dispatch();
};