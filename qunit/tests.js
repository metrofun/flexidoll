var count = function(obj) {
    var count=0;
    for (var i in obj) {
        count++;
    };
    return count;
}

jQuery(function(){
    module('Init');

    asyncTest('RectActor',1000, function() {
        expect(2);
        var actor;
        (actor = new RectActor(10,10,100,100)).jNode.click();
        equals(count(Engine.actorNodeList), 1, 'Shape created');

        actor.remove();
        setTimeout(
            function() {
                start();
                equals(count(Engine.actorNodeList), 0, 'Shape deleted');
            },
            300
        );
    })

    test('UI', function() { 
        expect(2);
        equals(UI.jScene.children().length, 1, 'Empty scene');

        jQuery('#edit').click();
        var actor;
        (actor = new RectActor(10,10,100,100)).jNode.click();

        stop(1000);
        Physics.execInWorkerContext(
            function() {
                return PhysWorker.selectedBody != null;
            },
            function(event, result) {
                start();
                actor.remove();
                ok(result, null, 'Shape selected');

            }
        );
    })  
});
