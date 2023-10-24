import java.util.Iterator;

/**
 * Walker takes an Iterable of Coords and simulates an individual
 * walking along the path over the given Terrain
 */
public class Walker {

    private final Terrain terrain;
    private final Iterator<Coord> path;
    private Coord location;
    private boolean doneWalking = false;

    // terrain: the Terrain the Walker traverses
    // path: the sequence of Coords the Walker follows
    public Walker(Terrain terrain, Iterable<Coord> path) {
        this.terrain = terrain;
        this.path = path.iterator();
        this.location = this.path.next();
    }

    // returns the Walker's current location
    public Coord getLocation() {
        return this.location;
    }

    // returns true if Walker has reached the end Coord (last in path)
    public boolean doneWalking() {
        return this.doneWalking;
    }

    // advances the Walker along path
    // byTime: how long the Walker should traverse (may be any non-negative value)
    public void advance(float byTime) {

        Coord next;
        while (byTime > 0 && this.path.hasNext()) {
            next = this.path.next();
            float travelCost = terrain.computeTravelCost(this.location, next);
            if (travelCost > byTime) break;
            else byTime -= travelCost;
            this.location = next;
        }
        this.doneWalking = !path.hasNext();

    }

}
